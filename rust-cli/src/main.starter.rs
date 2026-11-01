use clap::Parser;

#[derive(Parser, Debug)]
#[command(version, about = "$${description}")]
struct Cli {
    /// Example positional argument
    input: Option<String>,

    /// Example flag
    #[arg(short, long)]
    verbose: bool,
}

fn main() {
    let cli = Cli::parse();
    if cli.verbose {
        eprintln!("{cli:?}");
    }
    println!("Hello from $${name_kebab}");
}
