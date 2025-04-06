using System;
using System.Collections.Generic;

namespace NDogalApp.Data.Entities
{
    // Ürün kategorilerini temsil eden entity sınıfı.
    public class CategoryEntity : BaseEntity
    {
        public string Name { get; set; }        // Kategori adı
        public string? Description { get; set; } // Kategori açıklaması (isteğe bağlı)

        // --- İlişkisel Özellikler (Navigation Properties) ---

        // Bir kategorinin birden fazla ürünü olabilir.
        public ICollection<ProductEntity> Products { get; set; }

        // Constructor
        public CategoryEntity()
        {
            Products = new HashSet<ProductEntity>();
        }
    }
}