using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    // Sepetteki ürün miktarını güncelleme API isteği için model.
    // Hangi ürünün güncelleneceği URL'den (basketItemId) alınacak.
    public class UpdateBasketItemRequest
    {
        [Required(ErrorMessage = "Yeni miktar zorunludur.")]
        [Range(1, 100, ErrorMessage = "Miktar 1 ile 100 arasında olmalıdır.")]
        public int NewQuantity { get; set; }
    }
}