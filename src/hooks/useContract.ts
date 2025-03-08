/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";
import { readContract, writeContract } from "@wagmi/core";
import { config } from '@/app/providers'
import { useAccount } from "wagmi";


// Custom hook for on-demand fetching
export const useContractInteraction = () => {
    const { isConnected } = useAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    

    // Function to read from a contract
    const readFromContract = useCallback(async (contractAddress: `0x${string}`, abi: any[], functionName: string, args: any[]) => {
        if (!isConnected) {
            setError('Wallet not connected');
            return;
        }
        setIsLoading(true);
        try {
            const result = await readContract(config,{
                address: contractAddress,
                abi: abi,
                functionName: functionName,
                args: args,
            });
            setError(null);
            return result;
            
        } catch (err) {
            setError(err);
            console.log('Transaction params:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isConnected]);

    // Function to write to a contract
    const writeToContract = useCallback(async (contractAddress: `0x${string}`, abi: any[], functionName: string, args: any[], value: bigint) => {
        if (!isConnected) {
            setError('Wallet not connected');
            return;
        }
        setIsLoading(true);
        try {
            const transaction = await writeContract(config, {
                address: contractAddress,
                abi: abi,
                functionName: functionName,
                args: args,
                value: value,
            });
            
            setError(null);
            return transaction
        } catch (err) {
            setError(err);
            console.log('Transaction params:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isConnected]);

    return {
        isLoading,
        error,
        readFromContract,
        writeToContract
    };
};


