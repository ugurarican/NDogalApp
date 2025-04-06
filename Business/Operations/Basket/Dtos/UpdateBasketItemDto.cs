using System;

namespace NDogalApp.Business.Operations.Basket.Dtos
{
    // Sepetteki bir ürünün miktarını güncellemek için kullanılan DTO.
    public class UpdateBasketItemDto
    {
        public int UserId { get; set; } // Güvenlik ve yetki kontrolü için
        public int BasketItemId { get; set; }
        public int NewQuantity { get; set; }
    }
}