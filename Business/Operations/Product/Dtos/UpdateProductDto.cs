using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Product.Dtos
{
    // Mevcut bir ürünü güncellemek için kullanılan DTO.
    public class UpdateProductDto
    {
        public int Id { get; set; } // Hangi ürünün güncelleneceği
        public string Name { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public int CategoryId { get; set; }
    }
}