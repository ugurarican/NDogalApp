using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace NDogalApp.Data.Entities
{
    // BasketEntity için Fluent API yapılandırmaları.
    public class BasketConfiguration : BaseConfiguration<BasketEntity>
    {
        public override void Configure(EntityTypeBuilder<BasketEntity> builder)
        {
            base.Configure(builder);

            builder.HasOne(b => b.User)
                   .WithOne(u => u.Basket) 
                   .HasForeignKey<BasketEntity>(b => b.UserId) 
                   .IsRequired();

            builder.HasMany(b => b.BasketItems) 
                   .WithOne(bi => bi.Basket)   
                   .HasForeignKey(bi => bi.BasketId) 
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}