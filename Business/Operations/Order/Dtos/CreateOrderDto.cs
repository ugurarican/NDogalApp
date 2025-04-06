using System;

namespace NDogalApp.Business.Operations.Order.Dtos
{
    // Yeni sipariş oluşturma isteği için DTO.
    public class CreateOrderDto
    {
        public int UserId { get; set; }
        // Sipariş anında özel bir teslimat adresi veya not girilmek istenirse:
        public string? ShippingAddress { get; set; }
        public string? Notes { get; set; }
    }
}