using System;

namespace NDogalApp.Data.Entities
{
    // Sepetteki tek bir ürün kalemini temsil eder (Hangi üründen kaç tane var?).
    public class BasketItemEntity : BaseEntity
    {
        // Foreign Key: Bu sepet öğesi hangi sepete ait?
        public int BasketId { get; set; }

        // Foreign Key: Bu sepet öğesi hangi ürünü temsil ediyor?
        public int ProductId { get; set; }

        // Bu üründen sepette kaç tane var?
        public int Quantity { get; set; }

        // --- İlişkisel Özellikler (Navigation Properties) ---

        // Navigation Property: Ait olduğu sepet.
        public BasketEntity Basket { get; set; }

        // Navigation Property: Temsil ettiği ürün.
        public ProductEntity Product { get; set; }
    }
}