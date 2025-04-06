namespace NDogalApp.Business.Operations.Order.Dtos
{
    // Kısmen gönderilmiş bir siparişin kalan tüm ürünlerini göndermek için DTO.
    public class ShipRemainingOrderItemsDto
    {
        public int OrderId { get; set; }
        public string? AdminNotes { get; set; } // Opsiyonel not
    }
}