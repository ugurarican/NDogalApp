using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NDogalApp.Business.Operations.Order.Dtos;
using NDogalApp.Business.Types;
using NDogalApp.Data.Entities;
using NDogalApp.Data.Enums;
using NDogalApp.Data.Repositories;
using NDogalApp.Data.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Order
{
    public class OrderManager : IOrderService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<OrderEntity> _orderRepository;
        private readonly IRepository<OrderItemEntity> _orderItemRepository;
        private readonly IRepository<BasketEntity> _basketRepository;
        private readonly IRepository<BasketItemEntity> _basketItemRepository;
        private readonly IRepository<ProductEntity> _productRepository;
        private readonly IRepository<UserEntity> _userRepository;
        private readonly ILogger<OrderManager> _logger;

        public OrderManager(
            IUnitOfWork unitOfWork,
            IRepository<OrderEntity> orderRepository,
            IRepository<OrderItemEntity> orderItemRepository,
            IRepository<BasketEntity> basketRepository,
            IRepository<BasketItemEntity> basketItemRepository,
            IRepository<ProductEntity> productRepository,
            IRepository<UserEntity> userRepository,
            ILogger<OrderManager> logger)
        {
            _unitOfWork = unitOfWork;
            _orderRepository = orderRepository;
            _orderItemRepository = orderItemRepository;
            _basketRepository = basketRepository;
            _basketItemRepository = basketItemRepository;
            _productRepository = productRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<ServiceMessage<OrderDto>> CreateOrderFromBasketAsync(CreateOrderDto createOrderDto)
        {
            _logger.LogInformation("Attempting to create order from basket for UserId: {UserId}", createOrderDto.UserId);
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                _logger.LogInformation("Fetching basket for UserId: {UserId}", createOrderDto.UserId);
                var basket = await _basketRepository
                                    .GetAll(b => b.UserId == createOrderDto.UserId)
                                    .Include(b => b.BasketItems)
                                        .ThenInclude(bi => bi.Product)
                                    .FirstOrDefaultAsync();

                if (basket == null || !basket.BasketItems.Any())
                {
                    _logger.LogWarning("Basket is empty or not found for UserId: {UserId}. Rolling back transaction.", createOrderDto.UserId);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage<OrderDto> { IsSucceed = false, Message = "Kullanıcının sepeti boş veya bulunamadı." };
                }
                _logger.LogInformation("Basket found with {ItemCount} items for UserId: {UserId}", basket.BasketItems.Count, createOrderDto.UserId);

                _logger.LogInformation("Checking stock for items in basket for UserId: {UserId}", createOrderDto.UserId);
                var productIdsInBasket = basket.BasketItems.Select(bi => bi.ProductId).ToList();
                var productsInDb = await _productRepository
                                          .GetAll(p => productIdsInBasket.Contains(p.Id))
                                          .ToListAsync();

                foreach (var basketItem in basket.BasketItems)
                {
                    var product = productsInDb.FirstOrDefault(p => p.Id == basketItem.ProductId);
                    if (product == null || product.StockQuantity < basketItem.Quantity)
                    {
                        string productName = product?.Name ?? basketItem.Product?.Name ?? $"ID:{basketItem.ProductId}";
                        string reason = product == null ? "bulunamadı" : $"yetersiz stok (Stok: {product.StockQuantity}, İstenen: {basketItem.Quantity})";
                        _logger.LogWarning("Stock check failed for Product: {ProductName} ({Reason}) for UserId: {UserId}. Rolling back transaction.", productName, reason, createOrderDto.UserId);
                        await _unitOfWork.RollbackTransactionAsync();
                        return new ServiceMessage<OrderDto> { IsSucceed = false, Message = $"Sepetteki ürün ({productName}) {reason}." };
                    }
                }
                _logger.LogInformation("Stock check passed for all items for UserId: {UserId}", createOrderDto.UserId);

                _logger.LogInformation("Creating OrderEntity for UserId: {UserId}", createOrderDto.UserId);
                var orderEntity = new OrderEntity
                {
                    UserId = createOrderDto.UserId,
                    OrderDate = DateTime.UtcNow,
                    Status = OrderStatus.PendingApproval,
                    TotalAmount = basket.BasketItems.Sum(bi => (bi.Product?.Price ?? 0) * bi.Quantity),
                    ShippingAddress = createOrderDto.ShippingAddress,
                    Notes = createOrderDto.Notes,
                    OrderItems = new HashSet<OrderItemEntity>()
                };

                _logger.LogInformation("Creating OrderItemEntities and updating stock for UserId: {UserId}", createOrderDto.UserId);
                foreach (var basketItem in basket.BasketItems)
                {
                    var product = productsInDb.First(p => p.Id == basketItem.ProductId);
                    var orderItem = new OrderItemEntity
                    {
                        ProductId = basketItem.ProductId,
                        Quantity = basketItem.Quantity,
                        Price = product.Price,
                        ShippedQuantity = 0 // Başlangıçta 0 gönderildi
                    };
                    orderEntity.OrderItems.Add(orderItem);
                    _logger.LogDebug("Added OrderItem for ProductId: {ProductId}, Quantity: {Quantity} to OrderEntity for UserId: {UserId}", orderItem.ProductId, orderItem.Quantity, createOrderDto.UserId);

                    product.StockQuantity -= basketItem.Quantity;
                    await _productRepository.UpdateAsync(product);
                    _logger.LogDebug("Updated stock for ProductId: {ProductId}, New Stock: {StockQuantity} for UserId: {UserId}", product.Id, product.StockQuantity, createOrderDto.UserId);
                }

                _logger.LogInformation("Adding OrderEntity with {ItemCount} items to repository for UserId: {UserId}", orderEntity.OrderItems.Count, createOrderDto.UserId);
                await _orderRepository.AddAsync(orderEntity);

                _logger.LogInformation("Clearing basket items for UserId: {UserId}", createOrderDto.UserId);
                foreach (var basketItem in basket.BasketItems.ToList())
                {
                    await _basketItemRepository.HardDeleteAsync(basketItem);
                    _logger.LogDebug("Hard deleted BasketItem Id: {BasketItemId} for UserId: {UserId}", basketItem.Id, createOrderDto.UserId);
                }

                _logger.LogInformation("Committing transaction for UserId: {UserId}", createOrderDto.UserId);
                await _unitOfWork.CommitTransactionAsync();

                _logger.LogInformation("Order created successfully. Mapping OrderEntity Id: {OrderId} to DTO for UserId: {UserId}", orderEntity.Id, createOrderDto.UserId);
                var createdOrderDto = await MapOrderEntityToDtoAsync(orderEntity.Id);

                if (createdOrderDto == null)
                {
                    _logger.LogWarning("Order created (Id: {OrderId}) but failed to map to DTO for UserId: {UserId}.", orderEntity.Id, createOrderDto.UserId);
                    return new ServiceMessage<OrderDto> { IsSucceed = true, Message = "Sipariş oluşturuldu ancak detayları getirilemedi." };
                }

                return new ServiceMessage<OrderDto> { IsSucceed = true, Data = createdOrderDto, Message = "Sipariş başarıyla oluşturuldu." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during CreateOrderFromBasketAsync for UserId: {UserId}. Rolling back transaction.", createOrderDto.UserId);
                await _unitOfWork.RollbackTransactionAsync();
                return new ServiceMessage<OrderDto> { IsSucceed = false, Message = $"Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin." };
            }
        }

        public async Task<ServiceMessage<List<OrderDto>>> GetOrdersByUserIdAsync(int userId)
        {
            _logger.LogInformation("Fetching orders for UserId: {UserId}", userId);
            try
            {
                var orders = await _orderRepository
                                    .GetAll(o => o.UserId == userId)
                                    .Include(o => o.User)
                                    .Include(o => o.OrderItems)
                                        .ThenInclude(oi => oi.Product)
                                    .OrderByDescending(o => o.OrderDate)
                                    .ToListAsync();

                _logger.LogInformation("Found {OrderCount} orders for UserId: {UserId}", orders.Count, userId);
                var orderDtos = orders.Select(MapOrderToDto).ToList();

                return new ServiceMessage<List<OrderDto>> { IsSucceed = true, Data = orderDtos };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching orders for UserId: {UserId}", userId);
                return new ServiceMessage<List<OrderDto>> { IsSucceed = false, Message = "Siparişler getirilirken bir hata oluştu." };
            }
        }

        public async Task<ServiceMessage<OrderDto?>> GetOrderByIdAsync(int orderId, int? userId = null)
        {
            _logger.LogInformation("Fetching order details for OrderId: {OrderId}, requesting UserId: {UserId}", orderId, userId ?? 0);
            try
            {
                var orderDto = await MapOrderEntityToDtoAsync(orderId);

                if (orderDto == null)
                {
                    _logger.LogWarning("Order not found for OrderId: {OrderId}", orderId);
                    return new ServiceMessage<OrderDto?> { IsSucceed = false, Message = "Sipariş bulunamadı." };
                }

                if (userId.HasValue && orderDto.UserId != userId.Value)
                {
                    _logger.LogWarning("Unauthorized attempt to access OrderId: {OrderId} by UserId: {UserId}. Order belongs to UserId: {OwnerUserId}", orderId, userId.Value, orderDto.UserId);
                    return new ServiceMessage<OrderDto?> { IsSucceed = false, Message = "Siparişi görüntüleme yetkiniz yok.", Data = null };
                }

                _logger.LogInformation("Successfully fetched order details for OrderId: {OrderId}", orderId);
                return new ServiceMessage<OrderDto?> { IsSucceed = true, Data = orderDto };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching order details for OrderId: {OrderId}", orderId);
                return new ServiceMessage<OrderDto?> { IsSucceed = false, Message = "Sipariş detayı getirilirken bir hata oluştu." };
            }
        }

        public async Task<ServiceMessage<List<OrderDto>>> GetAllOrdersAsync(OrderStatus? statusFilter = null)
        {
            _logger.LogInformation("Fetching all orders. Status filter: {StatusFilter}", statusFilter?.ToString() ?? "None");
            try
            {
                IQueryable<OrderEntity> query = _orderRepository
                                    .GetAll()
                                    .Include(o => o.User)
                                    .Include(o => o.OrderItems)
                                        .ThenInclude(oi => oi.Product)
                                    .OrderByDescending(o => o.OrderDate);

                if (statusFilter.HasValue)
                {
                    _logger.LogInformation("Applying status filter: {StatusFilter}", statusFilter.Value);
                    query = query.Where(o => o.Status == statusFilter.Value);
                }

                var orders = await query.ToListAsync();
                _logger.LogInformation("Found {OrderCount} total orders.", orders.Count);
                var orderDtos = orders.Select(MapOrderToDto).ToList();

                return new ServiceMessage<List<OrderDto>> { IsSucceed = true, Data = orderDtos };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all orders.");
                return new ServiceMessage<List<OrderDto>> { IsSucceed = false, Message = "Tüm siparişler getirilirken bir hata oluştu." };
            }
        }

        public async Task<ServiceMessage> UpdateOrderStatusAsync(UpdateOrderStatusDto statusDto, int adminUserId)
        {
            _logger.LogInformation("Attempting to update status for OrderId: {OrderId} to {NewStatus} by AdminUserId: {AdminUserId}", statusDto.OrderId, statusDto.NewStatus, adminUserId);

            if (statusDto.NewStatus == OrderStatus.Shipped || statusDto.NewStatus == OrderStatus.PartiallyShipped)
            {
                _logger.LogWarning("UpdateOrderStatusAsync cannot be used to set status to {NewStatus}. Use specific methods. OrderId: {OrderId}", statusDto.NewStatus, statusDto.OrderId);
                return new ServiceMessage { IsSucceed = false, Message = $"Durumu '{statusDto.NewStatus}' yapmak için ilgili kargo metotlarını kullanın." };
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var order = await _orderRepository.GetByIdAsync(statusDto.OrderId);
                if (order == null)
                {
                    _logger.LogWarning("Order not found for status update. OrderId: {OrderId}. Rolling back transaction.", statusDto.OrderId);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = "Sipariş bulunamadı." };
                }

                bool isTransitionAllowed = true;
                string errorMessage = $"Siparişin mevcut durumu ({order.Status}) yeni duruma ({statusDto.NewStatus}) değiştirilemez.";

                if (order.Status == OrderStatus.CancelledByAdmin ||
                    order.Status == OrderStatus.CancelledByCustomer ||
                    order.Status == OrderStatus.Completed)
                {
                    if (statusDto.NewStatus != order.Status)
                        isTransitionAllowed = false;
                }
                else if (order.Status == OrderStatus.Delivered)
                {
                    if (statusDto.NewStatus != OrderStatus.Completed && statusDto.NewStatus != OrderStatus.Delivered)                        isTransitionAllowed = false;
                }

                if (!isTransitionAllowed)
                {
                    _logger.LogWarning("Invalid status transition attempt for OrderId: {OrderId} from {OldStatus} to {NewStatus}", order.Id, order.Status, statusDto.NewStatus);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = errorMessage };
                }

                _logger.LogInformation("Updating status for OrderId: {OrderId} from {OldStatus} to {NewStatus}", order.Id, order.Status, statusDto.NewStatus);
                order.Status = statusDto.NewStatus;

                if (!string.IsNullOrWhiteSpace(statusDto.AdminNotes))
                {
                    order.Notes = $"[Admin ({adminUserId}) @ {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC Status Update]: {statusDto.AdminNotes}\n---\n{order.Notes}";
                    _logger.LogInformation("Admin notes added for OrderId: {OrderId}", order.Id);
                }

                await _orderRepository.UpdateAsync(order);
                await _unitOfWork.CommitTransactionAsync();

                _logger.LogInformation("Successfully updated status for OrderId: {OrderId} to {NewStatus}", order.Id, order.Status);

                return new ServiceMessage { IsSucceed = true, Message = "Sipariş durumu güncellendi." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during UpdateOrderStatusAsync for OrderId: {OrderId}. Rolling back transaction.", statusDto.OrderId);
                await _unitOfWork.RollbackTransactionAsync();
                return new ServiceMessage { IsSucceed = false, Message = "Sipariş durumu güncellenirken bir hata oluştu." };
            }
        }

        public async Task<ServiceMessage> MarkOrderAsPartiallyShippedAsync(MarkOrderPartiallyShippedDto dto, int adminUserId)
        {
            _logger.LogInformation("Attempting to mark OrderId: {OrderId} as Partially Shipped by AdminUserId: {AdminUserId}", dto.OrderId, adminUserId);
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var order = await _orderRepository
                                    .GetAll(o => o.Id == dto.OrderId)
                                    .Include(o => o.OrderItems)
                                    .FirstOrDefaultAsync();

                if (order == null)
                {
                    _logger.LogWarning("Order not found for partial shipment. OrderId: {OrderId}. Rolling back transaction.", dto.OrderId);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = "Sipariş bulunamadı." };
                }

                if (order.Status != OrderStatus.Approved)
                {
                    _logger.LogWarning("Cannot partially ship order with status {OrderStatus}. OrderId: {OrderId}. Rolling back transaction.", order.Status, dto.OrderId);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = $"Sadece 'Onaylandı' durumundaki siparişler kısmen gönderilebilir (Mevcut Durum: {order.Status})." };
                }

                if (dto.ShippedItems == null || !dto.ShippedItems.Any())
                {
                    _logger.LogWarning("No items specified for partial shipment. OrderId: {OrderId}. Rolling back transaction.", dto.OrderId);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = "Kısmen gönderilecek ürünler belirtilmedi." };
                }

                bool anyItemShipped = false;
                foreach (var shippedItemDto in dto.ShippedItems)
                {
                    var orderItem = order.OrderItems.FirstOrDefault(oi => oi.Id == shippedItemDto.OrderItemId);
                    if (orderItem == null)
                    {
                        _logger.LogWarning("OrderItemId {OrderItemId} not found in OrderId {OrderId} for partial shipment. Rolling back transaction.", shippedItemDto.OrderItemId, dto.OrderId);
                        await _unitOfWork.RollbackTransactionAsync();
                        return new ServiceMessage { IsSucceed = false, Message = $"Siparişte {shippedItemDto.OrderItemId} ID'li ürün kalemi bulunamadı." };
                    }

                    int pendingQuantity = orderItem.Quantity - orderItem.ShippedQuantity;
                    if (shippedItemDto.QuantityToShip <= 0)
                    {
                        _logger.LogWarning("Invalid QuantityToShip ({QuantityToShip}) for OrderItemId {OrderItemId}. Rolling back transaction.", shippedItemDto.QuantityToShip, shippedItemDto.OrderItemId);
                        await _unitOfWork.RollbackTransactionAsync();
                        return new ServiceMessage { IsSucceed = false, Message = $"Gönderilecek miktar ({shippedItemDto.QuantityToShip}) pozitif olmalıdır (Ürün Kalemi ID: {shippedItemDto.OrderItemId})." };
                    }
                    if (shippedItemDto.QuantityToShip > pendingQuantity)
                    {
                        _logger.LogWarning("QuantityToShip ({QuantityToShip}) exceeds pending quantity ({PendingQuantity}) for OrderItemId {OrderItemId}. Rolling back transaction.", shippedItemDto.QuantityToShip, pendingQuantity, shippedItemDto.OrderItemId);
                        await _unitOfWork.RollbackTransactionAsync();
                        return new ServiceMessage { IsSucceed = false, Message = $"Gönderilmek istenen miktar ({shippedItemDto.QuantityToShip}), bekleyen miktarı ({pendingQuantity}) aşıyor (Ürün Kalemi ID: {shippedItemDto.OrderItemId})." };
                    }

                    orderItem.ShippedQuantity += shippedItemDto.QuantityToShip;
                    await _orderItemRepository.UpdateAsync(orderItem);
                    anyItemShipped = true;
                    _logger.LogInformation("Updated ShippedQuantity for OrderItemId: {OrderItemId} to {ShippedQuantity}. Pending: {PendingQuantity}", orderItem.Id, orderItem.ShippedQuantity, orderItem.Quantity - orderItem.ShippedQuantity);

                }

                if (!anyItemShipped)
                {
                    _logger.LogWarning("No valid items were processed for partial shipment. OrderId: {OrderId}. Rolling back transaction.", dto.OrderId);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = "Gönderim için geçerli ürün belirtilmedi veya işlenemedi." };
                }


                bool allItemsFullyShipped = order.OrderItems.All(oi => oi.ShippedQuantity == oi.Quantity);
                order.Status = allItemsFullyShipped ? OrderStatus.Shipped : OrderStatus.PartiallyShipped;
                _logger.LogInformation("Set OrderId: {OrderId} status to {NewStatus}", order.Id, order.Status);


                if (!string.IsNullOrWhiteSpace(dto.AdminNotes))
                {
                    order.Notes = $"[Admin ({adminUserId}) @ {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC Partial Shipment]: {dto.AdminNotes}\n---\n{order.Notes}";
                    _logger.LogInformation("Admin notes added for partial shipment for OrderId: {OrderId}", order.Id);
                }

                await _orderRepository.UpdateAsync(order);
                await _unitOfWork.CommitTransactionAsync(); // Tüm değişiklikleri kaydet

                _logger.LogInformation("Successfully marked OrderId: {OrderId} as {NewStatus}", order.Id, order.Status);
                // Kullanıcıya bildirim gönder (Kısmi gönderim yapıldı)

                return new ServiceMessage { IsSucceed = true, Message = $"Sipariş başarıyla '{order.Status}' olarak işaretlendi." };

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during MarkOrderAsPartiallyShippedAsync for OrderId: {OrderId}. Rolling back transaction.", dto.OrderId);
                await _unitOfWork.RollbackTransactionAsync();
                return new ServiceMessage { IsSucceed = false, Message = "Sipariş kısmen gönderildi olarak işaretlenirken bir hata oluştu." };
            }
        }

        public async Task<ServiceMessage> ShipRemainingOrderItemsAsync(ShipRemainingOrderItemsDto dto, int adminUserId)
        {
            _logger.LogInformation("Attempting to ship remaining items for OrderId: {OrderId} by AdminUserId: {AdminUserId}", dto.OrderId, adminUserId);
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var order = await _orderRepository
                                    .GetAll(o => o.Id == dto.OrderId)
                                    .Include(o => o.OrderItems)
                                    .FirstOrDefaultAsync();

                if (order == null)
                {
                    _logger.LogWarning("Order not found for shipping remaining items. OrderId: {OrderId}. Rolling back transaction.", dto.OrderId);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = "Sipariş bulunamadı." };
                }

                if (order.Status != OrderStatus.PartiallyShipped)
                {
                    _logger.LogWarning("Cannot ship remaining items for order with status {OrderStatus}. OrderId: {OrderId}. Rolling back transaction.", order.Status, dto.OrderId);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = $"Sadece 'Kısmen Kargolandı' durumundaki siparişlerin kalanları gönderilebilir (Mevcut Durum: {order.Status})." };
                }

                bool itemsUpdated = false;
                foreach (var orderItem in order.OrderItems.Where(oi => oi.ShippedQuantity < oi.Quantity))
                {
                    _logger.LogInformation("Shipping remaining {Quantity} of OrderItemId: {OrderItemId}", orderItem.Quantity - orderItem.ShippedQuantity, orderItem.Id);
                    orderItem.ShippedQuantity = orderItem.Quantity;
                    await _orderItemRepository.UpdateAsync(orderItem);
                    itemsUpdated = true;
                }

                if (!itemsUpdated)
                {
                    _logger.LogWarning("No remaining items found to ship for OrderId: {OrderId} with status PartiallyShipped. Rolling back transaction.", dto.OrderId);
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = "Gönderilecek kalan ürün bulunamadı." };
                }

                order.Status = OrderStatus.Shipped;
                _logger.LogInformation("Set OrderId: {OrderId} status to Shipped after sending remaining items", order.Id);


                if (!string.IsNullOrWhiteSpace(dto.AdminNotes))
                {
                    order.Notes = $"[Admin ({adminUserId}) @ {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC Ship Remaining]: {dto.AdminNotes}\n---\n{order.Notes}";
                    _logger.LogInformation("Admin notes added for shipping remaining items for OrderId: {OrderId}", order.Id);
                }

                await _orderRepository.UpdateAsync(order);
                await _unitOfWork.CommitTransactionAsync();

                _logger.LogInformation("Successfully shipped remaining items for OrderId: {OrderId}", order.Id);

                return new ServiceMessage { IsSucceed = true, Message = "Siparişin kalan ürünleri başarıyla kargolandı ve durumu 'Kargolandı' olarak güncellendi." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during ShipRemainingOrderItemsAsync for OrderId: {OrderId}. Rolling back transaction.", dto.OrderId);
                await _unitOfWork.RollbackTransactionAsync();
                return new ServiceMessage { IsSucceed = false, Message = "Siparişin kalan ürünleri gönderilirken bir hata oluştu." };
            }
        }
        private OrderDto MapOrderToDto(OrderEntity order)
        {
            if (order == null) return null;

            return new OrderDto
            {
                Id = order.Id,
                UserId = order.UserId,
                UserFullName = $"{order.User?.FirstName} {order.User?.LastName}",
                UserEmail = order.User?.Email ?? string.Empty,
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                Status = order.Status, 
                ShippingAddress = order.ShippingAddress,
                Notes = order.Notes,
                Items = order.OrderItems?.Select(oi => new OrderItemDto
                {
                    Id = oi.Id,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product?.Name ?? "Bilinmeyen Ürün",
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    ProductImageUrl = oi.Product?.ImageUrl,
                    ShippedQuantity = oi.ShippedQuantity
                }).ToList() ?? new List<OrderItemDto>()
            };
        }
        private async Task<OrderDto?> MapOrderEntityToDtoAsync(int orderId)
        {
            var order = await _orderRepository
                              .GetAll(o => o.Id == orderId)
                              .Include(o => o.User)
                              .Include(o => o.OrderItems)
                                  .ThenInclude(oi => oi.Product)
                              .FirstOrDefaultAsync();

            if (order == null) return null;
            return MapOrderToDto(order);
        }
    }
}