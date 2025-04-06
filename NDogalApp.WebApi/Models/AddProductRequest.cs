using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    // Ürün ekleme API isteği için model.
    public class AddProductRequest
    {
        [Required(ErrorMessage = "Ürün adı zorunludur.")]
        [MaxLength(150, ErrorMessage = "Ürün adı en fazla 150 karakter olabilir.")]
        public string Name { get; set; }

        [MaxLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Fiyat zorunludur.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Fiyat 0'dan büyük olmalıdır.")]
        [DataType(DataType.Currency)] // Veri tipini belirtir
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Stok miktarı zorunludur.")]
        [Range(0, int.MaxValue, ErrorMessage = "Stok miktarı 0 veya daha büyük olmalıdır.")]
        public int StockQuantity { get; set; }

        [MaxLength(500, ErrorMessage = "Görsel URL'si en fazla 500 karakter olabilir.")]
        [Url(ErrorMessage = "Geçerli bir URL giriniz.")] // URL format kontrolü
        public string? ImageUrl { get; set; }

        [Required(ErrorMessage = "Kategori ID'si zorunludur.")]
        [Range(1, int.MaxValue, ErrorMessage = "Geçerli bir Kategori ID'si giriniz.")]
        public int CategoryId { get; set; }
    }
}