using System.Collections.Generic;

namespace NDogalApp.Business.Operations.Order.Dtos
{
    // Admin'in hangi siparişin hangi ürünlerinden kaçar adet gönderdiğini belirtmesi için DTO.
    public class MarkOrderPartiallyShippedDto
    {
        public int OrderId { get; set; }
        // Gönderilen ürünler ve miktarları
        public List<PartialShipmentItemDto> ShippedItems { get; set; } = new List<PartialShipmentItemDto>();
        public string? AdminNotes { get; set; } // Opsiyonel not
    }

    // Kısmi gönderimde hangi üründen ne kadar gönderildiğini tutar.
    public class PartialShipmentItemDto
    {
        public int OrderItemId { get; set; } // Hangi sipariş kaleminin gönderildiği
        public int QuantityToShip { get; set; } // Bu üründen BU SEFERDE kaç adet gönderildiği
    }
}