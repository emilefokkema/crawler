﻿using System;
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
            await using var container = builder.Build();
            var crawlerOperator = container.Resolve<ManualCrawlerOperator>();
            var urlQueue = container.Resolve<IUrlQueue>();
            urlQueue.Add(new Uri("http://foo.crawlable.web:8080/"));
            //urlQueue.Add(new Uri("http://nu.nl"));
            await crawlerOperator.Start();
        }
    }
}
