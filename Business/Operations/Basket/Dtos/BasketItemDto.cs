using System;

namespace NDogalApp.Business.Operations.Basket.Dtos
{
    // Sepetteki tek bir öğeyi temsil eden DTO.
    public class BasketItemDto
    {
        public int Id { get; set; } // BasketItemEntity'nin Id'si (güncelleme/silme için kullanılabilir)
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; } // Ürünün o anki birim fiyatı
        public decimal TotalPrice => UnitPrice * Quantity; // Hesaplanan toplam fiyat (DTO içinde)
        public string? ProductImageUrl { get; set; } // Ürün görseli
    }
}