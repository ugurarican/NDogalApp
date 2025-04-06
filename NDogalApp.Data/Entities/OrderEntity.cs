using NDogalApp.Data.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace NDogalApp.Data.Entities
{
    // Kullanıcının verdiği siparişi temsil eder.
    public class OrderEntity : BaseEntity
    {
        // Foreign Key: Bu sipariş hangi kullanıcıya ait?
        public int UserId { get; set; }

        public DateTime OrderDate { get; set; } // Siparişin verildiği tarih ve saat

        // Siparişin toplam tutarı (o anki fiyatlar üzerinden hesaplanacak)
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        // Siparişin mevcut durumu (Onay Bekliyor, Onaylandı vb.)
        public OrderStatus Status { get; set; }

        // --- İsteğe Bağlı Alanlar ---
        public string? ShippingAddress { get; set; } // Teslimat adresi (Kullanıcıdan farklı olabilir)
        public string? Notes { get; set; }           // Müşteri veya yönetici notları

        // --- İlişkisel Özellikler (Navigation Properties) ---

        // Navigation Property: Siparişin ait olduğu Kullanıcı.
        public UserEntity User { get; set; }

        // Navigation Property: Bu siparişteki ürün kalemleri.
        public ICollection<OrderItemEntity> OrderItems { get; set; }

        // Constructor
        public OrderEntity()
        {
            OrderItems = new HashSet<OrderItemEntity>();
            OrderDate = DateTime.UtcNow; // Sipariş oluşturulduğunda tarih otomatik atansın
            Status = OrderStatus.PendingApproval; // Varsayılan durum Onay Bekliyor olsun
        }
    }
}