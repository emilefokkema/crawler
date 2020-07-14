using System;

namespace Crawler.Logging
{
    public interface IColoredLineWriter
    {
        void WriteLine(string line, ConsoleColor color);
    }
}
