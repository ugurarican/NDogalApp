using System;

namespace NDogalApp.Business.Operations.Basket.Dtos
{
    // Sepetten ürün silmek için kullanılan DTO.
    public class RemoveBasketItemDto
    {
        public int UserId { get; set; } // Güvenlik ve yetki kontrolü için
        public int BasketItemId { get; set; }
    }
}