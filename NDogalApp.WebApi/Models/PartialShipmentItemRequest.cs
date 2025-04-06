using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    public class PartialShipmentItemRequest
    {
        [Required(ErrorMessage = "Ürün Kalemi ID'si zorunludur.")]
        [Range(1, int.MaxValue)]
        public int OrderItemId { get; set; }

        [Required(ErrorMessage = "Gönderilen miktar zorunludur.")]
        [Range(1, int.MaxValue, ErrorMessage = "Gönderilen miktar en az 1 olmalıdır.")]
        public int QuantityToShip { get; set; }
    }
}