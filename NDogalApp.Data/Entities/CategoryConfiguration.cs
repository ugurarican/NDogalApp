using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace NDogalApp.Data.Entities
{
    // CategoryEntity için Fluent API yapılandırmaları.
    public class CategoryConfiguration : BaseConfiguration<CategoryEntity>
    {
        public override void Configure(EntityTypeBuilder<CategoryEntity> builder)
        {
            // Temel yapılandırmaları uygula
            base.Configure(builder);

            // CategoryEntity'ye özel yapılandırmalar:

            // Name alanı zorunlu ve maksimum 75 karakter.
            builder.Property(x => x.Name)
                   .IsRequired()
                   .HasMaxLength(75);

            builder.HasIndex(x => x.Name).IsUnique();

            // Description alanı zorunlu değil ve maksimum 250 karakter.
            builder.Property(x => x.Description)
                   .IsRequired(false) // Null olabilir
                   .HasMaxLength(250);
            builder.HasMany(c => c.Products)        
                   .WithOne(p => p.Category)           
                   .HasForeignKey(p => p.CategoryId)  
                   .OnDelete(DeleteBehavior.Restrict); 
            
        }
    }
}