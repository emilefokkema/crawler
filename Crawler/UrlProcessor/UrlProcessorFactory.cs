using System;
using Autofac;

namespace Crawler.UrlProcessor
{
    public class UrlProcessorFactory: IUrlProcessorFactory
    {
        private readonly ILifetimeScope _lifetimeScope;

        public UrlProcessorFactory(ILifetimeScope lifetimeScope)
        {
            _lifetimeScope = lifetimeScope;
        }

        public UrlProcessor Create(Uri url)
        {
            return _lifetimeScope.BeginLifetimeScope(builder =>
            {
                builder.RegisterInstance(new UrlToProcess(url));

            }).Resolve<UrlProcessor>();
        }
    }
}
