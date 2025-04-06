using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace NDogalApp.Data.Entities
{
    // OrderItemEntity için Fluent API yapılandırmaları.
    public class OrderItemConfiguration : BaseConfiguration<OrderItemEntity>
    {
        public override void Configure(EntityTypeBuilder<OrderItemEntity> builder)
        {
            base.Configure(builder);

            // OrderItem'a özel yapılandırmalar:

            builder.Property(x => x.Quantity)
                   .IsRequired();

            builder.Property(x => x.Price)
                   .IsRequired()
                   .HasPrecision(18, 2);

            // --- İlişki Yapılandırmaları ---

            // OrderItem ile Order arasındaki Many-to-One ilişkisi:
            builder.HasOne(oi => oi.Order)
                   .WithMany(o => o.OrderItems) // OrderEntity'deki OrderItems koleksiyonu
                   .HasForeignKey(oi => oi.OrderId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Cascade); // OrderConfiguration ile tutarlı

            // OrderItem ile Product arasındaki Many-to-One ilişkisi:
            builder.HasOne(oi => oi.Product)
                   .WithMany(p => p.OrderItems) // ProductEntity'deki OrderItems koleksiyonu
                   .HasForeignKey(oi => oi.ProductId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}