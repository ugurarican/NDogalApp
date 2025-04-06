using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Product.Dtos
{
    // Yeni ürün eklemek için kullanılan DTO.
    public class AddProductDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; } // Fiyat decimal olmalı
        public int StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public int CategoryId { get; set; } // Hangi kategoriye ait olduğu
    }
}