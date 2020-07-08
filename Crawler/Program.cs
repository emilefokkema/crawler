using System;
using System.Threading.Tasks;
using Autofac;

namespace Crawler
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var builder = new ContainerBuilder();
            builder.RegisterModule<CrawlerModule>();
            var container = builder.Build();

            var crawlerOperator = container.Resolve<ManualCrawlerOperator>();
            var urlQueue = container.Resolve<IUrlQueue>();
            //urlQueue.Add("https://www.iana.org/domains/example");
            urlQueue.Add("http://www.example.com");
            await crawlerOperator.Start();
        }
    }
}
