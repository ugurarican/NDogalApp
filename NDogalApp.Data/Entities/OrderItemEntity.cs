using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace NDogalApp.Data.Entities
{
    public class OrderItemEntity : BaseEntity
    {
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; } // Sipariş edilen toplam miktar

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        // Bu üründen ne kadarının kargolandığını takip eder.
        public int ShippedQuantity { get; set; } = 0; // Varsayılan olarak 0 olsun

        public OrderEntity Order { get; set; }
        public ProductEntity Product { get; set; }
    }
}