using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    // Sepete ürün ekleme API isteği için model.
    public class AddItemToBasketRequest
    {
        [Required(ErrorMessage = "Ürün ID'si zorunludur.")]
        [Range(1, int.MaxValue, ErrorMessage = "Geçerli bir Ürün ID'si giriniz.")]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Miktar zorunludur.")]
        [Range(1, 100, ErrorMessage = "Miktar 1 ile 100 arasında olmalıdır.")]
        public int Quantity { get; set; }
    }
}