const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 1. AJOUTER CETTE LIGNE

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'index.css' }), // 2. AJOUTER CE BLOC
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        // 3. REMPLACER 'style-loader' PAR MiniCssExtractPlugin.loader
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
            filename: '[name][ext]' // Garde les noms de fichiers propres pour les polices
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
