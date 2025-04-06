using System;
using System.Collections.Generic;
using System.Linq;

namespace NDogalApp.Business.Operations.Basket.Dtos
{
    // Kullanıcının tüm sepetini ve içindeki öğeleri temsil eden DTO.
    public class BasketDto
    {
        public int Id { get; set; } // BasketEntity'nin Id'si
        public int UserId { get; set; }
        public List<BasketItemDto> Items { get; set; } = new List<BasketItemDto>(); // Sepetteki ürünler
        public decimal TotalBasketPrice => Items.Sum(item => item.TotalPrice); // Sepetin toplam tutarı
        public int TotalItemsCount => Items.Sum(item => item.Quantity); // Sepetteki toplam ürün adedi
    }
}