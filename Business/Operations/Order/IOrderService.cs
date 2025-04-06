using NDogalApp.Business.Operations.Order.Dtos;
using NDogalApp.Business.Types;
using NDogalApp.Data.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Order
{
    // Sipariş işlemleri için servis arayüzü.
    public interface IOrderService
    {
        // Kullanıcının sepetini siparişe dönüştürür.
        Task<ServiceMessage<OrderDto>> CreateOrderFromBasketAsync(CreateOrderDto createOrderDto);

        // Belirli bir kullanıcının tüm siparişlerini getirir.
        Task<ServiceMessage<List<OrderDto>>> GetOrdersByUserIdAsync(int userId);

        // Tek bir siparişin detayını getirir (Kullanıcı veya Admin için).
        Task<ServiceMessage<OrderDto?>> GetOrderByIdAsync(int orderId, int? userId = null); // userId, yetki kontrolü için

        // Tüm siparişleri getirir (Admin için, filtreleme seçenekleri eklenebilir).
        Task<ServiceMessage<List<OrderDto>>> GetAllOrdersAsync(OrderStatus? statusFilter = null);

        // Sipariş durumunu günceller (Admin yetkisiyle).
        Task<ServiceMessage> UpdateOrderStatusAsync(UpdateOrderStatusDto statusDto, int adminUserId); // İşlemi yapan adminin Id'si

        Task<ServiceMessage> MarkOrderAsPartiallyShippedAsync(MarkOrderPartiallyShippedDto dto, int adminUserId);

        // Kısmen gönderilmiş bir siparişin kalan ürünlerini kargolar.
        Task<ServiceMessage> ShipRemainingOrderItemsAsync(ShipRemainingOrderItemsDto dto, int adminUserId);
    }
}