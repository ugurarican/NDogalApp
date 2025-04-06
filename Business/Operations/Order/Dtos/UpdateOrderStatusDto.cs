using NDogalApp.Data.Enums;
using System;

namespace NDogalApp.Business.Operations.Order.Dtos
{
    // Sipariş durumunu güncellemek için kullanılan DTO (Admin yetkisiyle).
    public class UpdateOrderStatusDto
    {
        public int OrderId { get; set; }
        public OrderStatus NewStatus { get; set; }
        public string? AdminNotes { get; set; } // Yönetici not eklemek isterse
    }
}