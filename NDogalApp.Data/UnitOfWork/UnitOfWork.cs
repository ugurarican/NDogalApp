using Microsoft.EntityFrameworkCore.Storage;
using NDogalApp.Data.Context;          
using System;
using System.Threading.Tasks;           

namespace NDogalApp.Data.UnitOfWork
{
    // Unit of Work pattern implementasyonu.
    public class UnitOfWork : IUnitOfWork
    {
        private readonly NDogalDbContext _db;
        private IDbContextTransaction? _currentTransaction; // Mevcut işlemi tutar (nullable)

        // Constructor: DbContext'i Dependency Injection ile alır.
        public UnitOfWork(NDogalDbContext db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        // Değişiklikleri DbContext üzerinden kaydeder.
        // DbContext'teki SaveChanges interceptor'ları (CreatedTime/ModifiedDate ayarı) burada tetiklenir.
        public async Task<int> SaveChangesAsync()
        {
            return await _db.SaveChangesAsync();
        }

        // --- Transaction Yönetimi ---

        public async Task BeginTransactionAsync()
        {
            if (_currentTransaction != null)
            {
                throw new InvalidOperationException("Zaten aktif bir transaction bulunmaktadır.");
            }
            _currentTransaction = await _db.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            try
            {
                if (_currentTransaction == null)
                {
                    throw new InvalidOperationException("Aktif bir transaction bulunmamaktadır.");
                }
                await _db.SaveChangesAsync(); // Commit öncesi son değişiklikleri kaydet
                await _currentTransaction.CommitAsync();
            }
            catch
            {
                // Commit başarısız olursa, rollback yapmayı dene.
                await RollbackTransactionAsync();
                throw; // Hatayı tekrar fırlat
            }
            finally
            {
                // İşlem tamamlandıktan veya rollback yapıldıktan sonra transaction nesnesini dispose et.
                if (_currentTransaction != null)
                {
                    await _currentTransaction.DisposeAsync();
                    _currentTransaction = null;
                }
            }
        }

        public async Task RollbackTransactionAsync()
        {
            try
            {
                if (_currentTransaction != null)
                {
                    await _currentTransaction.RollbackAsync();
                }
            }
            finally
            {
                // Rollback sonrası transaction nesnesini dispose et.
                if (_currentTransaction != null)
                {
                    await _currentTransaction.DisposeAsync();
                    _currentTransaction = null;
                }
            }
        }

        // --- IDisposable Implementasyonu ---

        private bool disposed = false;

        protected virtual void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                    if (_currentTransaction != null)
                    {
                        _currentTransaction.Dispose();
                        _currentTransaction = null;
                    }
                }
            }
            this.disposed = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}