import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart = [...cart];
      const stockResponse = await api.get(`/stock/${productId}`)
      const stock: Stock = await stockResponse.data;

      let index = newCart.findIndex(product => product.id === productId);
      if (index < 0) {
        const response = await api.get(`/products/${productId}`)
        const productData = await response.data;
        if (stock.amount > 0) {
          newCart.push({
            id: productId,
            title: productData.title,
            price: productData.price,
            image: productData.image,
            amount: 1,
          });
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        } else {
          throw new Error;
        }
      } else {
        if (newCart[index].amount < stock.amount) {
          newCart[index].amount = newCart[index].amount + 1;
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      let newCart = [...cart];

      let index = newCart.findIndex(product => product.id === productId);
      if (index >= 0) {
        newCart.splice(index, 1);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        throw new Error;
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount > 0) {
        let newCart = [...cart];
        const stockResponse = await api.get(`/stock/${productId}`)
        const stock: Stock = await stockResponse.data;

        let index = newCart.findIndex(product => product.id === productId);
        if (index >= 0) {
          if (amount <= stock.amount) {
            newCart[index].amount = amount;
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        } else {
          throw new Error;
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
