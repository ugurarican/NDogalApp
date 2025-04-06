using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    public class MarkOrderPartiallyShippedRequest
    {
        // OrderId URL'den alınacak

        [Required(ErrorMessage = "Gönderilen ürün listesi zorunludur.")]
        [MinLength(1, ErrorMessage = "En az bir ürün gönderilmelidir.")]
        public List<PartialShipmentItemRequest> ShippedItems { get; set; }

        [MaxLength(500)]
        public string? AdminNotes { get; set; }
    }
}