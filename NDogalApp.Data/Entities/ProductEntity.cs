using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema; 

namespace NDogalApp.Data.Entities
{
    // Satılacak ürünleri temsil eden entity sınıfı.
    public class ProductEntity : BaseEntity
    {
        public string Name { get; set; }        // Ürün adı
        public string? Description { get; set; } // Ürün açıklaması (isteğe bağlı)

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }      // Ürün fiyatı

        public int StockQuantity { get; set; }  // Stok miktarı
        public string? ImageUrl { get; set; }   // Ürün görselinin URL'si (isteğe bağlı)

        // --- İlişkisel Alanlar ve Özellikler ---

        // Foreign Key: Bu ürün hangi kategoriye ait?
        public int CategoryId { get; set; }

        // Navigation Property: Ürünün ait olduğu Kategori nesnesine erişim sağlar.
        public CategoryEntity Category { get; set; }

        // Bir ürün birden fazla sepet öğesinde (farklı sepetlerde) bulunabilir.
         public ICollection<BasketItemEntity> BasketItems { get; set; }

        // Bir ürün birden fazla sipariş öğesinde (farklı siparişlerde) bulunabilir.
        public ICollection<OrderItemEntity> OrderItems { get; set; }

        // Constructor
        public ProductEntity()
        {
            BasketItems = new HashSet<BasketItemEntity>();
            OrderItems = new HashSet<OrderItemEntity>();
        }
    }
}