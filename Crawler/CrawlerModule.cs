using System.Net.Http;
using Autofac;
using Crawler.Robots;

namespace Crawler
{
    public class CrawlerModule: Module
    {
        protected override void Load(ContainerBuilder builder)
        {
            builder.Register((c) =>
            {
                var client = new HttpClient();
                client.DefaultRequestHeaders.UserAgent.TryParseAdd(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36");
                return client;
            }).SingleInstance();
            builder.RegisterType<Client>().As<IClient>().SingleInstance();
            builder.RegisterType<UrlQueue>().As<IUrlQueue>().SingleInstance();
            builder.RegisterType<Crawler>().As<ICrawler>().SingleInstance();
            builder.RegisterType<UrlFinderConsumer>().As<IResultConsumer>();
            builder.RegisterType<ErrorConsumer>().As<IResultConsumer>();
            builder.RegisterType<ColoredLineWriter>().As<IColoredLineWriter>();
            builder.RegisterType<ReadRobots>().As<IRobots>();
            builder.RegisterType<Web>();
            builder.RegisterType<ManualCrawlerOperator>();
        }
    }
}
