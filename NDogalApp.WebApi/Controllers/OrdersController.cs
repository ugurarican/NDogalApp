using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NDogalApp.Business.Operations.Order;
using NDogalApp.Business.Operations.Order.Dtos;
using NDogalApp.Data.Enums;
using NDogalApp.WebApi.Jwt;
using NDogalApp.WebApi.Models;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq; 
namespace NDogalApp.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        private int GetUserIdFromToken()
        {
            var userIdClaim = User.FindFirst(JwtClaimNames.Id);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Geçerli kullanıcı kimliği bulunamadı.");
            }
            return userId;
        }

        private bool IsUserAdmin()
        {
            return User.IsInRole(nameof(UserType.Admin));
        }

        // POST: api/orders
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            int userId;
            try { userId = GetUserIdFromToken(); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { Message = ex.Message }); }

            var createDto = new CreateOrderDto
            {
                UserId = userId,
                ShippingAddress = request.ShippingAddress,
                Notes = request.Notes
            };
            var result = await _orderService.CreateOrderFromBasketAsync(createDto);

            if (result.IsSucceed && result.Data != null)
                return CreatedAtAction(nameof(GetOrderById), new { id = result.Data.Id }, result.Data);
            else
            {
                if (result.Message != null && (result.Message.Contains("sepeti boş", StringComparison.OrdinalIgnoreCase) || result.Message.Contains("stok", StringComparison.OrdinalIgnoreCase)))
                    return BadRequest(new { Message = result.Message });
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Sipariş oluşturulurken bir hata oluştu." });
            }
        }

        // GET: api/orders/my
        [HttpGet("my")]
        public async Task<IActionResult> GetMyOrders()
        {
            int userId;
            try { userId = GetUserIdFromToken(); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { Message = ex.Message }); }

            var result = await _orderService.GetOrdersByUserIdAsync(userId);

            if (result.IsSucceed && result.Data != null)
                return Ok(result.Data);
            else
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Siparişler getirilirken bir hata oluştu." });
        }

        // GET: api/orders/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            int userId = 0; // Admin değilse atanacak
            bool isAdmin = IsUserAdmin();
            if (!isAdmin) // Admin değilse ID'yi almayı dene
            {
                try { userId = GetUserIdFromToken(); }
                catch (UnauthorizedAccessException ex) { return Unauthorized(new { Message = ex.Message }); }
            }

            var result = await _orderService.GetOrderByIdAsync(id, isAdmin ? (int?)null : userId);

            if (result.IsSucceed)
            {
                if (result.Data != null) return Ok(result.Data);
                else return NotFound(new { Message = result.Message ?? $"ID'si {id} olan sipariş bulunamadı veya yetkiniz yok." });
            }
            else
            {
                if (result.Message != null && (result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase) || result.Message.Contains("yetkiniz yok", StringComparison.OrdinalIgnoreCase)))
                    return NotFound(new { Message = result.Message });
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Sipariş detayı getirilirken bir hata oluştu." });
            }
        }

        // GET: api/orders
        [HttpGet]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> GetAllOrders([FromQuery] OrderStatus? status = null)
        {
            // ... (Kod önceki yanıttaki gibi) ...
            var result = await _orderService.GetAllOrdersAsync(status);
            if (result.IsSucceed && result.Data != null) return Ok(result.Data);
            else return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Tüm siparişler getirilirken bir hata oluştu." });
        }


        // PUT: api/orders/{id}/status
        [HttpPut("{id}/status")]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            // ... (Kod önceki yanıttaki gibi, PartiallyShipped kontrolü eklendi) ...
            if (!ModelState.IsValid) return BadRequest(ModelState);
            int adminUserId;
            try { adminUserId = GetUserIdFromToken(); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { Message = ex.Message }); }

            // Bu endpoint ile Kısmi/Tam kargolama durumları AYARLANAMAZ.
            if (request.NewStatus == OrderStatus.PartiallyShipped || request.NewStatus == OrderStatus.Shipped)
            {
                return BadRequest(new { Message = $"Durumu '{request.NewStatus}' yapmak için ilgili kısmi veya tam kargo endpoint'lerini kullanın." });
            }


            var updateDto = new UpdateOrderStatusDto
            {
                OrderId = id,
                NewStatus = request.NewStatus,
                AdminNotes = request.AdminNotes
            };
            var result = await _orderService.UpdateOrderStatusAsync(updateDto, adminUserId);

            if (result.IsSucceed) return Ok(new { Message = result.Message ?? "Sipariş durumu başarıyla güncellendi." });
            else
            {
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                    return NotFound(new { Message = result.Message });
                // Geçersiz durum geçişi veya başka bir hata BadRequest dönebilir
                return BadRequest(new { Message = result.Message ?? "Sipariş durumu güncellenirken bir hata oluştu." });
            }
        }

        // POST: api/orders/{id}/partially-ship
        [HttpPost("{id}/partially-ship")]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> MarkAsPartiallyShipped(int id, [FromBody] MarkOrderPartiallyShippedRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (request.ShippedItems == null || !request.ShippedItems.Any())
            {
                return BadRequest(new { Message = "Gönderilecek ürün listesi boş olamaz." });
            }


            int adminUserId;
            try { adminUserId = GetUserIdFromToken(); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { Message = ex.Message }); }

            var dto = new MarkOrderPartiallyShippedDto
            {
                OrderId = id,
                AdminNotes = request.AdminNotes,
                // Request modelinden DTO modeline map etme
                ShippedItems = request.ShippedItems.Select(item => new PartialShipmentItemDto
                {
                    OrderItemId = item.OrderItemId,
                    QuantityToShip = item.QuantityToShip
                }).ToList()
            };

            var result = await _orderService.MarkOrderAsPartiallyShippedAsync(dto, adminUserId);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Sipariş kısmen gönderildi olarak işaretlendi." });
            }
            else
            {
                // Sipariş bulunamadı, durum uygun değil, miktar geçersiz vb.
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                return BadRequest(new { Message = result.Message }); // Diğer hatalar için (miktar, durum vb.)
            }
        }

        // POST: api/orders/{id}/ship-remaining
        [HttpPost("{id}/ship-remaining")]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> ShipRemainingItems(int id, [FromBody] ShipRemainingOrderItemsRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            int adminUserId;
            try { adminUserId = GetUserIdFromToken(); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { Message = ex.Message }); }

            var dto = new ShipRemainingOrderItemsDto
            {
                OrderId = id,
                AdminNotes = request.AdminNotes
            };

            var result = await _orderService.ShipRemainingOrderItemsAsync(dto, adminUserId);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Siparişin kalan ürünleri kargolandı." });
            }
            else
            {
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                // Durum uygun değil veya gönderilecek ürün yoksa BadRequest
                return BadRequest(new { Message = result.Message });
            }
        }
    }
}