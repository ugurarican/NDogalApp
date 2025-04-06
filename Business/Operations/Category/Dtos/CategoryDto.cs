using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Category.Dtos
{
    // Kategori bilgilerini (listeleme, detay gösterme vb.) istemciye göndermek için kullanılır.
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedTime { get; set; } 
    }
}