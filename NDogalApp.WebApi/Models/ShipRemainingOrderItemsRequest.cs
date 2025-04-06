using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    public class ShipRemainingOrderItemsRequest
    {
        // OrderId URL'den alınacak

        [MaxLength(500)]
        public string? AdminNotes { get; set; }
    }
}