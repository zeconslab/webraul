using webraul.Models;

namespace webraul.Services;

/// <summary>
/// Archivos privados del panel. Viven fuera de wwwroot (no tienen URL pública) y fuera de la carpeta
/// de la app, porque el deploy sincroniza esa carpeta con --delete.
/// </summary>
public sealed class FileStorage
{
    public const long MaxFileSize = 50L * 1024 * 1024;
    private static readonly char[] InvalidNameChars = [.. Path.GetInvalidFileNameChars(), '/', '\\', ':', '*', '?', '"', '<', '>', '|'];
    private readonly string root;

    public FileStorage(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var configured = configuration["Archivos:Ruta"];
        root = Path.GetFullPath(string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(environment.ContentRootPath, "..", "webraul-archivos")
            : Path.Combine(environment.ContentRootPath, configured));
    }

    /// <summary>Valida un nombre de archivo o carpeta. Devuelve el error o null si es válido.</summary>
    public static string? NameError(string? name)
    {
        name = name?.Trim();
        if (string.IsNullOrEmpty(name)) return "Escribe un nombre.";
        if (name.Length > 120) return "El nombre es demasiado largo (máximo 120 caracteres).";
        if (name is "." or ".." || name.EndsWith('.')) return "Ese nombre no es válido.";
        if (name.IndexOfAny(InvalidNameChars) >= 0) return "El nombre no puede llevar / \\ : * ? \" < > |";
        return null;
    }

    /// <summary>Normaliza una ruta relativa ("Clientes/Acme") y comprueba que no se salga de la carpeta raíz.</summary>
    public string? Normalize(string? relative)
    {
        var parts = (relative ?? string.Empty).Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Any(p => NameError(p) is not null)) return null;
        var full = Path.GetFullPath(Path.Combine([root, .. parts]));
        return full == root || full.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal) ? string.Join('/', parts) : null;
    }

    public string FullPath(string normalized) => Path.Combine([root, .. normalized.Split('/', StringSplitOptions.RemoveEmptyEntries)]);

    public bool FolderExists(string normalized) => normalized.Length == 0 || Directory.Exists(FullPath(normalized));

    public IReadOnlyList<FileEntry> List(string folder)
    {
        var path = FullPath(folder);
        if (!Directory.Exists(path)) return [];
        string Relative(string name) => folder.Length == 0 ? name : $"{folder}/{name}";
        var folders = new DirectoryInfo(path).EnumerateDirectories()
            .Select(d => new FileEntry(d.Name, Relative(d.Name), true, 0, d.LastWriteTimeUtc, d.EnumerateFileSystemInfos().Count()));
        var files = new DirectoryInfo(path).EnumerateFiles()
            .Select(f => new FileEntry(f.Name, Relative(f.Name), false, f.Length, f.LastWriteTimeUtc, 0));
        return [.. folders.OrderBy(x => x.Name, StringComparer.CurrentCultureIgnoreCase), .. files.OrderBy(x => x.Name, StringComparer.CurrentCultureIgnoreCase)];
    }

    /// <summary>Guarda el archivo sin sobrescribir: si el nombre existe, agrega " (2)", " (3)"…</summary>
    public async Task<string> SaveAsync(string folder, IFormFile file)
    {
        var directory = FullPath(folder);
        Directory.CreateDirectory(directory);
        var original = Path.GetFileName(file.FileName).Trim();
        if (NameError(original) is not null) original = "archivo" + Path.GetExtension(original);
        var name = original;
        for (var i = 2; File.Exists(Path.Combine(directory, name)) || Directory.Exists(Path.Combine(directory, name)); i++)
            name = $"{Path.GetFileNameWithoutExtension(original)} ({i}){Path.GetExtension(original)}";
        var target = Path.Combine(directory, name);
        try
        {
            await using var stream = new FileStream(target, FileMode.CreateNew);
            await file.CopyToAsync(stream);
        }
        catch
        {
            // No dejar archivos a medias si la subida se corta
            File.Delete(target);
            throw;
        }
        return name;
    }

    public void CreateFolder(string folder, string name) => Directory.CreateDirectory(Path.Combine(FullPath(folder), name.Trim()));

    public bool Exists(string folder, string name)
    {
        var path = Path.Combine(FullPath(folder), name.Trim());
        return File.Exists(path) || Directory.Exists(path);
    }

    public void Rename(string item, string newName)
    {
        var source = FullPath(item);
        var target = Path.Combine(Path.GetDirectoryName(source)!, newName.Trim());
        if (Directory.Exists(source)) Directory.Move(source, target); else File.Move(source, target);
    }

    public void Delete(string item)
    {
        var path = FullPath(item);
        if (Directory.Exists(path)) Directory.Delete(path, recursive: true); else File.Delete(path);
    }
}
