using System;
using System.Collections.Generic;

namespace NDogalApp.Data.Entities
{
    // Kullanıcının alışveriş sepetini temsil eder.
    public class BasketEntity : BaseEntity
    {
        // Foreign Key: Bu sepet hangi kullanıcıya ait?
        public int UserId { get; set; }

        // --- İlişkisel Özellikler (Navigation Properties) ---

        // Navigation Property: Sepetin ait olduğu Kullanıcı nesnesine erişim sağlar.
        public UserEntity User { get; set; }

        // Navigation Property: Bu sepetteki ürünleri (BasketItemEntity) içerir.
        public ICollection<BasketItemEntity> BasketItems { get; set; }

        // Constructor
        public BasketEntity()
        {
            BasketItems = new HashSet<BasketItemEntity>(); // Koleksiyonu başlat
        }
    }
}