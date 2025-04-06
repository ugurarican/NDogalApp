using System;

namespace NDogalApp.Business.Operations.Basket.Dtos
{
    // Sepete ürün eklemek için kullanılan DTO.
    public class AddItemToBasketDto
    {
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}