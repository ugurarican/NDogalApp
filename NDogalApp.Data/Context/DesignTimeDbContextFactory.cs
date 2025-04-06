using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using NDogalApp.Data.Context;

namespace NDogalApp.Data
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<NDogalDbContext>
    {
        public NDogalDbContext CreateDbContext(string[] args)
        {
            var connectionString = "server=SAMSUNG\\MSSQLSERVER01; database=NDogalAppDb; Trusted_Connection=true; TrustServerCertificate=true;";


            var optionsBuilder = new DbContextOptionsBuilder<NDogalDbContext>();
            optionsBuilder.UseSqlServer(connectionString);

            Console.WriteLine("[DesignTimeDbContextFactory] Using hardcoded connection string for testing.");

            return new NDogalDbContext(optionsBuilder.Options);
        }
    }
}