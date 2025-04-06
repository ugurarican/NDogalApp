using Microsoft.EntityFrameworkCore;
using NDogalApp.Data.Entities;
using System.Reflection;

namespace NDogalApp.Data.Context
{
    public class NDogalDbContext : DbContext
    {
        public NDogalDbContext(DbContextOptions<NDogalDbContext> options) : base(options)
        {
        }

        // Veritabanı tablolarına karşılık gelen DbSet özellikleri.
        // EF Core bu özellikler üzerinden tabloları oluşturur ve CRUD işlemlerini yönetir.
        public DbSet<UserEntity> Users => Set<UserEntity>();
        public DbSet<CategoryEntity> Categories => Set<CategoryEntity>();
        public DbSet<ProductEntity> Products => Set<ProductEntity>();
        public DbSet<BasketEntity> Baskets => Set<BasketEntity>();
        public DbSet<BasketItemEntity> BasketItems => Set<BasketItemEntity>();
        public DbSet<OrderEntity> Orders => Set<OrderEntity>();
        public DbSet<OrderItemEntity> OrderItems => Set<OrderItemEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            base.OnModelCreating(modelBuilder);
        }

        public override int SaveChanges()
        {
            SetTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SetTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void SetTimestamps()
        {
            var entries = ChangeTracker
                .Entries()
                .Where(e => e.Entity is BaseEntity && (
                        e.State == EntityState.Added
                        || e.State == EntityState.Modified));

            foreach (var entityEntry in entries)
            {
                if (entityEntry.State == EntityState.Added)
                {
                    ((BaseEntity)entityEntry.Entity).CreatedTime = DateTime.UtcNow;
                    ((BaseEntity)entityEntry.Entity).ModifiedDate = null;
                    ((BaseEntity)entityEntry.Entity).isDeleted = false;
                }
                else if (entityEntry.State == EntityState.Modified)
                {
                    ((BaseEntity)entityEntry.Entity).ModifiedDate = DateTime.UtcNow;

                    var baseEntity = (BaseEntity)entityEntry.Entity;
                    if (entityEntry.Property(nameof(baseEntity.CreatedTime)).IsModified)
                    {
                        entityEntry.Property(nameof(baseEntity.CreatedTime)).IsModified = false;
                    }
                }
            }
        }
    }
}