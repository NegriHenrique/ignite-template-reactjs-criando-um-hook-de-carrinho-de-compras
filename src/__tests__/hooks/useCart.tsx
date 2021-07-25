import { ReactNode, useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { toast } from "react-toastify";
import { api } from "../../services/api";

interface Product {
  id: number;
  title: string;
  image: string;
  price: number;
  amount: number;
}

interface CartContextProps {
  cart: Product[];
  removeProduct: (productId: number) => void;
  updateProductAmount: (productId: number, amount: number) => void;
  addProduct: (productId: number) => void;
}

interface CartProviderProps {
  children: ReactNode;
}

const CartContext = createContext<CartContextProps>({} as CartContextProps);

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    const localStorageCart = localStorage.getItem("@RocketShoes:cart");

    setCart(JSON.parse(localStorageCart || "[]"));
  }, []);

  async function addProduct(productId: number) {
    try {
      const product = cart.find((prod) => productId === prod.id);
      if (product) {
        updateProductAmount(productId, product.amount);
      } else {
        const { data: stock } = await api.get(`/stock/${productId}`);

        if (stock > 0) {
          const { data: newProduct } = await api.get(`/products/${productId}`);
          setCart([...cart, { ...newProduct, amount: 1 }]);
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch (error) {
      toast.error("Erro na adição do produto");
    }
  }

  function removeProduct(productId: number) {
    try {
      const newCart = cart.filter((product) => product.id !== productId);
      setCart(newCart);

      updateLocalStorage(newCart);
    } catch (error) {
      toast.error("Erro na remoção do produto");
    }
  }

  async function updateProductAmount(productId: number, amount: number) {
    try {
      if (amount > 0) {
        const { data: stock } = await api.get(`/stock/${productId}`);
        if (stock <= amount) {
          const newCart = cart.map((prod) =>
            prod.id === productId ? { ...prod, amount } : prod
          );
          setCart(newCart);

          updateLocalStorage(newCart);
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch (error) {
      toast.error("Erro na alteração de quantidade do produto");
    }
  }

  function updateLocalStorage(newCart: Product[]) {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
  }

  return (
    <CartContext.Provider
      value={{ cart, removeProduct, updateProductAmount, addProduct }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
