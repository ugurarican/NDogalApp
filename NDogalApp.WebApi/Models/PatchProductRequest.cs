using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    public class PatchProductRequest
    {

        [MaxLength(150, ErrorMessage = "Ürün adı en fazla 150 karakter olabilir.")]
        public string? Name { get; set; }

        [MaxLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir.")]
        public string? Description { get; set; } 

        [Range(0.01, double.MaxValue, ErrorMessage = "Fiyat 0'dan büyük olmalıdır (eğer belirtilmişse).")]
        public decimal? Price { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Stok miktarı 0 veya daha büyük olmalıdır (eğer belirtilmişse).")]
        public int? StockQuantity { get; set; }

        [MaxLength(500, ErrorMessage = "Görsel URL'si en fazla 500 karakter olabilir.")]
        [Url(ErrorMessage = "Geçerli bir URL giriniz (eğer belirtilmişse).")]
        public string? ImageUrl { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Geçerli bir Kategori ID'si giriniz (eğer belirtilmişse).")]
        public int? CategoryId { get; set; }
    }
}