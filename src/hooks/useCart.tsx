import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {
      const updatedCart = [...cart];

      const productFound = updatedCart.find((product)=> product.id === productId);

      const { data } = await api.get<Stock>(`/products/${productId}`);

      const stockAmount = data.amount;
      
      const currentAmount = productFound ? productFound.amount : 0;

      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productFound) { 
        productFound.amount = amount;
      } else {
        const { data } = await api.get<Product>(`/products/${productId}`);
        updatedCart.push({
          ...data,
          amount: 1,
        });
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
       
    } catch {
      toast.error('Erro ao adicionar o produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = [...cart];
      const productFound = updateCart.find((product)=> product.id === productId);

      if (productFound) {
        const amount = productFound.amount - productFound.amount;

        if (amount <= 0) {
          updateCart.splice(updateCart.indexOf(productFound), 1);
        } else {
          productFound.amount = amount;
        }
      }

      setCart(updateCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));

    } catch {
      toast.error('Erro ao remover o produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
     
      const updateCart = [...cart];
      const productFound = updateCart.find((product)=> product.id === productId);

      if (productFound) {
        const { data } = await api.get<Stock>(`/stock/${productId}`);

        if (amount > data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        productFound.amount = amount;
      }

      setCart(updateCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));


    } catch {
      toast.error('Erro ao atualizar o carrinho');
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
