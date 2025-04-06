using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace NDogalApp.Data.Entities
{
    // ProductEntity için Fluent API yapılandırmaları.
    public class ProductConfiguration : BaseConfiguration<ProductEntity>
    {
        public override void Configure(EntityTypeBuilder<ProductEntity> builder)
        {
            // Temel yapılandırmaları uygula
            base.Configure(builder);

            // ProductEntity'ye özel yapılandırmalar:

            builder.Property(x => x.Name)
                   .IsRequired()
                   .HasMaxLength(150); 

            builder.Property(x => x.Description)
                   .IsRequired(false)
                   .HasMaxLength(500); 

            builder.Property(x => x.Price)
                   .IsRequired()
                   .HasPrecision(18, 2); 

            builder.Property(x => x.StockQuantity)
                   .IsRequired();

            builder.Property(x => x.ImageUrl)
                   .IsRequired(false)
                   .HasMaxLength(500);

            builder.HasOne(p => p.Category)            // Bir ürünün bir kategorisi var
                   .WithMany(c => c.Products)          // Bir kategorinin çok ürünü var
                   .HasForeignKey(p => p.CategoryId)   // Product'taki FK: CategoryId
                   .OnDelete(DeleteBehavior.Restrict); // İlişkili Kategori silinemez (CategoryConfiguration'daki ile tutarlı olmalı)

            // Product ile BasketItem arasındaki One-to-Many ilişkisi 
            builder.HasMany(p => p.BasketItems)        // Bir ürünün çok sayıda sepet öğesi olabilir
                   .WithOne(bi => bi.Product)         // Her sepet öğesi bir ürüne aittir
                   .HasForeignKey(bi => bi.ProductId) // BasketItem'daki FK: ProductId
                   .OnDelete(DeleteBehavior.Cascade); 
            

            // Product ile OrderItem arasındaki One-to-Many ilişkisi 
            builder.HasMany(p => p.OrderItems)         // Bir ürünün çok sayıda sipariş öğesi olabilir
                   .WithOne(oi => oi.Product)         // Her sipariş öğesi bir ürüne aittir
                   .HasForeignKey(oi => oi.ProductId) // OrderItem'daki FK: ProductId
                   .OnDelete(DeleteBehavior.Restrict);
            
        }
    }
}