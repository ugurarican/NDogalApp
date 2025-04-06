using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Category.Dtos
{
    // Yeni kategori eklemek için kullanılacak veri transfer nesnesi.
    public class AddCategoryDto
    {
        public string Name { get; set; }
        public string? Description { get; set; } // Açıklama isteğe bağlı olabilir
    }
}