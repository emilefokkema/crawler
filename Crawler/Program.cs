using System;
using System.Net.Http;
using System.Threading.Tasks;
using Autofac;

namespace Crawler
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var builder = new ContainerBuilder();
            builder.RegisterType<HttpClient>();
            builder.RegisterType<Client>().As<IClient>();
            
            var container = builder.Build();
            var client = container.Resolve<IClient>();
            await client.Get("http://www.example.com");
            Console.WriteLine("Hello World!");
        }
    }
}
