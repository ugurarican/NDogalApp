using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace NDogalApp.Data.Entities
{
    // BasketItemEntity için Fluent API yapılandırmaları.
    public class BasketItemConfiguration : BaseConfiguration<BasketItemEntity>
    {
        public override void Configure(EntityTypeBuilder<BasketItemEntity> builder)
        {
            // Temel yapılandırmaları uygula (Id, CreatedTime vb.)
            base.Configure(builder);

            builder.Property(x => x.Quantity)
                   .IsRequired();

            // --- İlişki Yapılandırmaları ---

            builder.HasOne(bi => bi.Basket)
                   .WithMany(b => b.BasketItems)
                   .HasForeignKey(bi => bi.BasketId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(bi => bi.Product)
                   .WithMany(p => p.BasketItems) 
                   .HasForeignKey(bi => bi.ProductId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(bi => new { bi.BasketId, bi.ProductId }).IsUnique();
        }
    }
}