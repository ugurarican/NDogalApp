using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    // Kategori ekleme API isteği için model.
    public class AddCategoryRequest
    {
        [Required(ErrorMessage = "Kategori adı zorunludur.")]
        [MaxLength(75, ErrorMessage = "Kategori adı en fazla 75 karakter olabilir.")]
        public string Name { get; set; }

        [MaxLength(250, ErrorMessage = "Açıklama en fazla 250 karakter olabilir.")]
        public string? Description { get; set; } // İsteğe bağlı
    }
}