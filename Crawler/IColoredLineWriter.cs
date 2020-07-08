using System;

namespace Crawler
{
    public interface IColoredLineWriter
    {
        void WriteLine(string line, ConsoleColor color);
    }
}
