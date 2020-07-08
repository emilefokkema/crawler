using System;

namespace Crawler
{
    public class Web : ILinkConsumer
    {
        private readonly IUrlQueue _urlQueue;
        private readonly IColoredLineWriter _coloredLineWriter;

        public Web(IUrlQueue urlQueue, IColoredLineWriter coloredLineWriter)
        {
            _urlQueue = urlQueue;
            _coloredLineWriter = coloredLineWriter;
        }

        public void Consume(Link link)
        {
            _coloredLineWriter.WriteLine($"add link from {link.From} to {link.To}", ConsoleColor.DarkGray);
            _urlQueue.Add(link.To);
        }
    }
}
