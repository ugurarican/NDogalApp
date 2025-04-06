using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Order.Dtos
{
    public class OrderItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; } // İstenen Toplam Miktar
        public decimal Price { get; set; }
        public decimal TotalPrice => Price * Quantity; // Toplam istenen tutar
        public string? ProductImageUrl { get; set; }

        public int ShippedQuantity { get; set; } // Ne kadarı gönderildi
        public int PendingQuantity => Quantity - ShippedQuantity; // Ne kadarı bekliyor (Hesaplanan)
    }
}